import * as ImageManipulator from 'expo-image-manipulator';

/**
 * Downscale to a sane width and re-encode as JPEG before upload. A phone photo
 * can be many MB; the backend caps uploads at 12 MB and the models run at
 * 224x224, so anything past ~1024px wide is wasted bytes and latency.
 */
export async function prepareImage(uri: string): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1024 } }],
    { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG },
  );
  return result.uri;
}
